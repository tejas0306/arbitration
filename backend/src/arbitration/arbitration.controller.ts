import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpStatus,
  HttpException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { OpenAI } from 'openai';
import * as path from 'path';
import * as fs from 'fs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArbitrationService } from './arbitration.service';
import { CreateArbitrationDto } from './dto/create-arbitration.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { CaseResponseDto } from './dto/case-response.dto';
import { AssignArbitratorDto } from './dto/assign-arbitrator.dto';
import { ProposeArbitratorDto } from './dto/propose-arbitrator.dto';
import { RespondArbitratorProposalDto } from './dto/respond-arbitrator-proposal.dto';
import { ArbitratorResponseDto } from './dto/arbitrator-response.dto';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// File counter for uploads
let fileCounter = 1;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Data directory for storing AI responses
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

@Controller('arbitration')
@UseGuards(JwtAuthGuard)
export class ArbitrationController {
  constructor(private arbitrationService: ArbitrationService) {}

  @Post('submit')
  async submitRequest(
    @Body() createArbitrationDto: CreateArbitrationDto,
    @Request() req,
  ) {
    return this.arbitrationService.createCase(createArbitrationDto, req.user.id, false);
  }

  @Post('draft')
  async saveDraft(
    @Body() createArbitrationDto: CreateArbitrationDto,
    @Request() req,
  ) {
    return this.arbitrationService.createCase(createArbitrationDto, req.user.id, true);
  }

  @Get('cases')
  async getCases(@Query() filters: any, @Request() req) {
    console.log('🔍🔍🔍 ArbitrationController.getCases DEFINITELY CALLED 🔍🔍🔍');
    console.log('🔍 ArbitrationController.getCases called with:', {
      user: req.user,
      userId: req.user?.id,
      filters
    });
    
    const result = await this.arbitrationService.getCasesByUser(req.user.id, filters);
    console.log('🔍 ArbitrationController.getCases returning:', result.length, 'cases');
    return result;
  }

  @Get('cases/:id')
  async getCaseDetails(@Param('id') id: string) {
    return this.arbitrationService.getCaseById(id);
  }

  @Get('cases/:id/counter-response-data')
  async getCounterResponseData(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.getCounterResponseData(id, req.user.id);
  }

  @Patch('cases/:id/status')
  async updateCaseStatus(
    @Param('id') id: string,
    @Body() updateCaseStatusDto: UpdateCaseStatusDto,
  ) {
    return this.arbitrationService.updateCaseStatus(id, updateCaseStatusDto.status);
  }

  @Post('cases/:id/respond')
  async submitResponse(
    @Param('id') id: string,
    @Body() caseResponseDto: CaseResponseDto,
    @Request() req,
  ) {
    return this.arbitrationService.submitResponse(id, caseResponseDto, req.user.id);
  }

  @Post('cases/:id/assign-arbitrator')
  async assignArbitrator(
    @Param('id') id: string,
    @Body() assignArbitratorDto: AssignArbitratorDto,
  ) {
    return this.arbitrationService.assignArbitrator(id, assignArbitratorDto.arbitratorId);
  }

  @Post('draft/:id/submit')
  async submitDraft(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.submitDraft(id, req.user.id);
  }

  @Get('draft')
  async getDrafts(@Request() req) {
    return this.arbitrationService.getDraftsByUser(req.user.id);
  }

  @Get('draft/:id')
  async getDraftById(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.getDraftById(id, req.user.id);
  }

  @Get('debug/auth')
  async debugAuth(@Request() req) {
    console.log('🧪 DEBUG AUTH ENDPOINT HIT');
    console.log('🧪 User object:', req.user);
    console.log('🧪 User ID:', req.user?.id);
    console.log('🧪 User type:', typeof req.user?.id);
    
    // Get all cases (no filtering) for debugging
    const allCases = await this.arbitrationService.getAllCasesForDebug();
    
    return {
      authenticatedUser: req.user,
      totalCasesInDB: allCases.length,
      casesPreview: allCases.slice(0, 3).map(c => ({
        id: c.id,
        claimantId: c.claimantId,
        respondentId: c.respondentId,
        status: c.status
      }))
    };
  }

  // Arbitrator assignment workflow endpoints
  
  // Get all arbitrator proposals for a case
  @Get('cases/:id/arbitrator-proposals')
  async getArbitratorProposals(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.getArbitratorProposals(id);
  }
  
  // Propose an arbitrator for a case
  @Post('cases/:id/propose-arbitrator')
  async proposeArbitrator(
    @Param('id') id: string,
    @Body() proposeArbitratorDto: ProposeArbitratorDto,
    @Request() req
  ) {
    return this.arbitrationService.proposeArbitrator(id, proposeArbitratorDto, req.user.id);
  }
  
  // Respond to an arbitrator proposal
  @Post('arbitrator-proposals/:proposalId/respond')
  async respondToArbitratorProposal(
    @Param('proposalId') proposalId: string,
    @Body() responseDto: RespondArbitratorProposalDto,
    @Request() req
  ) {
    return this.arbitrationService.respondToArbitratorProposal(
      proposalId,
      responseDto,
      req.user.id
    );
  }
  
  // Arbitrator responds to a case assignment
  @Post('arbitrator-proposals/:proposalId/arbitrator-response')
  async arbitratorRespondsToAssignment(
    @Param('proposalId') proposalId: string,
    @Body() responseDto: ArbitratorResponseDto,
    @Request() req
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can respond to assignments');
    }
    
    return this.arbitrationService.arbitratorRespondsToAssignment(
      proposalId,
      responseDto,
      req.user.id
    );
  }
  
  // Get pending arbitrator assignments for an arbitrator
  @Get('arbitrator/assignments')
  async getArbitratorAssignments(@Request() req) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can view assignments');
    }
    
    return this.arbitrationService.getArbitratorAssignments(req.user.id);
  }

  // AI-powered contract upload and analysis
  @Post('uploadFileToAI')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const caseDir = path.join(uploadsDir, 'arbitration');
        console.log('Upload Directory Path:', caseDir);
        if (!fs.existsSync(caseDir)) {
          fs.mkdirSync(caseDir, { recursive: true });
        }
        cb(null, caseDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + (fileCounter++);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
  }))
  async uploadFileToAI(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Inside uploadFileToAI');

    if (!file) {
      console.log('No File Uploaded');
      return { error: 'No file uploaded', status: 400 };
    }

    const fileStream = fs.createReadStream(file.path);

    const aiFile = await openai.files.create({
      file: fileStream,
      purpose: "user_data",
    });

    const fileId = aiFile.id;
    console.log('fileId:', fileId);

    return { 'fileId': fileId };
  }

  // AI-powered contract analysis and data extraction
  @Post('generateAIResponse')
  @UseInterceptors(FileInterceptor('file'))
  async generateAIResponse(@Req() req: any) {
    console.log('Inside generateAIResponse', req.body);

    const fileId = req.body?.fileId;
    console.log('fileId:', fileId);

    if (!fileId) {
      throw new HttpException('File ID is required', HttpStatus.BAD_REQUEST);
    }

    const prompt = `
Extract and return JSON with:
- Party wise name, address, phone, email, CIN, PAN, GST and respective obligations with obligation description, obligation clauses reference and exact clause content from the uploaded document
- Agreement date and place of signing
- Supporting Documents
- Penalty clauses
- Arbitration clauses
- All clauses with clause description, clauses reference and exact clause content from the uploaded document`;

    const tools: any = [
      {
        "type": "function",
        "name": "extract_agreement_details",
        "description": "Extract key details from an agreement document.",
        "parameters": {
          "type": "object",
          "properties": {
            "agreementDate": {"type": "string"},
            "placeOfSigning": {"type": "string"},
            "supporting_documents": {
              "type": "array",
              "items": { "type": "string" }
            },
            "parties": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "address": {"type": "string"},
                  "phone": {"type": "string"},
                  "email": {"type": "string"},
                  "CIN": {"type": "string"},
                  "PAN": {"type": "string"},
                  "GST": {"type": "string"},
                  "obligations": {
                    "type": "array", 
                    "items": {
                      "type": "object",
                      "properties": {
                        "clauseNumber": {"type": "string"},
                        "description": {"type": "string"},
                        "clauseText": {"type": "string"}
                      },
                      "required": ["clauseNumber", "description", "clauseText"]
                    }
                  }
                },
                "required": ["name", "address","phone","email","CIN","PAN","GST","obligations"]
              }
            },
            "penalty_clauses": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "clauseNumber": {"type": "string"},
                  "description": {"type": "string"},
                  "penaltyDetails": {"type": "string"}
                }
              }
            },
            "arbitration_clause": {
              "type": "object",
              "properties": {
                "amicable_settlement": {"type": "string"},
                "arbitration": {"type": "string"},
                "arbitral_tribunal":{"type": "string"},
                "final_and_binding":{"type": "string"},
                "seat_and_venue": {"type": "string"},
                "language": {"type": "string"},
                "costs": {"type": "string"}
              },
              "required": ["arbitration","amicable_settlement","arbitral_tribunal","final_and_binding","seat_and_venue","language","costs"]
            },
            "clauses": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "clauseNumber": {"type": "string"},
                  "description": {"type": "string"},
                  "clauseText": {"type": "string"}
                },
                "required": ["clauseNumber", "description", "clauseText"]
              }
            }
          },
          "required": ["agreementDate", "parties", "arbitration_clause","clauses"]
        }
      }
    ];

    const chatRes = await openai.responses.create({
      model: "gpt-4.1",
      instructions: "You are an Indian law assistant. Provide legal guidance, counter-cases under IPC, CrPC, family law, cybercrime matters, and aggressive legal strategies to help the user win a criminal or civil case. Think like a senior defense lawyer.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: fileId,
            },
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      tools,
      tool_choice: {
        type: "function",
        name: "extract_agreement_details"
      },
      temperature: 0,
    });

    console.log(chatRes);

    const toolCalls = chatRes.output.filter(item => item.type === 'function_call');
    let result: any;

    toolCalls.forEach(call => {
      console.log("Tool Name:", call.name);
      console.log("call.arguments:", call.arguments);
      console.log("Arguments:", JSON.parse(call.arguments));
      result = JSON.parse(call.arguments);
      console.log("obligations:", result.obligations ? JSON.parse(result.obligations) : []);
    });

    const jsonResult = JSON.stringify(result, null, 2);
    console.log('result', jsonResult);
    this.writeJsonDatatoFile(fileId, jsonResult);
    return jsonResult || '{}';
  }

  // Read AI analysis results from file
  @Get('readAIResponse/:fileId')
  readAIResponseFromFile(@Param('fileId') fileId: string) {
    console.log('Inside readAIResponseFromFile', fileId);
    try {
      const filePath = path.join(DATA_DIR, `${fileId}.json`);

      if (!existsSync(filePath)) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new HttpException('Failed to read file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Helper method to extract JSON from AI response
  private extractJsonFromResponse(text: string) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : text;

    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      throw new Error('Failed to parse JSON: ' + err.message);
    }
  }

  // Helper method to save AI analysis data to file
  private writeJsonDatatoFile(fileId: string, data: any) {
    try {
      console.log('inside writeJsonDatatoFile');
      const filePath = path.join(DATA_DIR, `${fileId}.json`);
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('inside writeJsonDatatoFile data saved to file:', filePath);
    } catch (error) {
      throw new HttpException('Failed to save file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  @Post(':id/counter-response')
  async submitCounterResponse(
    @Param('id') caseId: string,
    @Body() body: { counterResponses: any[], issueResponses: any[] },
    @Req() request: Request
  ) {
    try {
      const token = (request.headers as any).authorization?.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedException('Missing authorization token');
      }

      const { counterResponses, issueResponses } = body;

      // For now, allow access to any authenticated user
      // In production, you'd want to properly verify the JWT token

      const caseData = await this.arbitrationService.getCaseWithDetails(caseId);
      
      if (!caseData) {
        throw new NotFoundException('Case not found');
      }

      // Create a new case response for the counter-response
      const counterResponse = await this.arbitrationService.createCounterResponse(
        caseId,
        caseData.userId,
        counterResponses,
        issueResponses
      );

      return {
        success: true,
        message: 'Counter-response submitted successfully',
        counterResponseId: counterResponse.id,
        nextStep: 'AI judgment will be generated within 3 days'
      };

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit counter-response');
    }
  }
}