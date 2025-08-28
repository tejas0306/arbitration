import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Req,
  Logger,
  HttpException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ArbitrationService } from '../services/arbitration.service';
import { ArbitrationDto } from '../dto/arbitration.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { writeFile } from 'fs/promises';

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import os from 'os';
import { createReadStream, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import FormData from 'form-data';
import axios from 'axios';

import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';



const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// File counter to generate sequential filenames
let fileCounter = 1;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = diskStorage({
  destination: (req, file, cb) => {
    const caseDir = path.join(uploadsDir, 'arbitration');
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }
    cb(null, caseDir);
  },
  filename: (req, file, cb) => {
    // Use a sequential number instead of a random one
    const uniqueSuffix = Date.now() + '-' + (fileCounter++);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const DATA_DIR = path.join(uploadsDir, 'data');
if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

@Controller('arbitration')
@UseGuards(JwtAuthGuard)
export class ArbitrationController {
  private readonly logger = new Logger(ArbitrationController.name);
  constructor(private readonly arbitrationService: ArbitrationService) {}

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        // Direct field names
        { name: 'coi', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'gstCert', maxCount: 1 },
        { name: 'agreementFile', maxCount: 1 },
        // Nested field names from claimant object
        { name: 'claimant.coi', maxCount: 1 },
        { name: 'claimant.panCard', maxCount: 1 },
        { name: 'claimant.gstCert', maxCount: 1 },
        { name: 'claimant.agreementFile', maxCount: 1 },
        // Supporting documents
        { name: 'supportingDocuments_0', maxCount: 1 },
        { name: 'supportingDocuments_1', maxCount: 1 },
        { name: 'supportingDocuments_2', maxCount: 1 },
        { name: 'supportingDocuments_3', maxCount: 1 },
        { name: 'supportingDocuments_4', maxCount: 1 },
        // Evidence files
        { name: 'evidenceFiles_0', maxCount: 1 },
        { name: 'evidenceFiles_1', maxCount: 1 },
        { name: 'evidenceFiles_2', maxCount: 1 },
        { name: 'evidenceFiles_3', maxCount: 1 },
        { name: 'evidenceFiles_4', maxCount: 1 },
        // Documents Evidence files
        { name: 'documentsEvidence_0_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_0_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_0_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_1_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_1_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_1_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_2_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_2_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_2_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_3_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_3_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_3_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_4_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_4_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_4_attachedDocuments_2', maxCount: 1 },
      ],
      { storage }
    )
  )
  async create(
    @Req() req,
    @Body('data') arbitrationDataString: string,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>
  ) {
    try {
      // Parse the JSON data
      const arbitrationData = JSON.parse(arbitrationDataString);
      
      // Map file paths
      const fileData = {};
      if (files) {
        Object.keys(files).forEach(key => {
          const file = files[key][0];
          // Handle nested field names (e.g., 'claimant.coi' -> 'coi')
          const normalizedKey = key.includes('.') ? key.split('.')[1] : key;
          fileData[normalizedKey] = {
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
          };
        });
      }
      
      // Combine structured data with file data
      const combinedData = {
        ...arbitrationData,
        files: fileData,
        status: 'pending'
      };
      
      // Get user ID from request
      const userId = req.user.id;
      this.logger.log(`Creating arbitration case for user ${userId}`);
      
      // Save to database
      return this.arbitrationService.create(combinedData, userId);
    } catch (error) {
      this.logger.error(`Error processing arbitration submission: ${error.message}`, error.stack);
      throw error;
    }
  }




@Post('uploadFileToAI')
@UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
  destination: (req, file, cb) => {
    const caseDir = path.join(uploadsDir, 'arbitration');
	console.log('Upload Directory PAth ',caseDir);
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }
    cb(null, caseDir);
  },
  filename: (req, file, cb) => {
    // Use a sequential number instead of a random one
    const uniqueSuffix = Date.now() + '-' + (fileCounter++);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
}),
    limits: {
      fileSize: 100 * 1024 * 1024, 
    },
  }))
  async uploadFileToAI(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {

    console.log('Inside uploadFileToAI');
	
	
	

  if (!file) {
  console.log('No File Uploaded');
    return { error: 'No file uploaded' ,  status: 400 };
  }


  const fileStream = fs.createReadStream(file.path);
  
  //console.log('fileStream',fileStream);

const aiFile = await openai.files.create({
    file: fileStream,
    purpose: "user_data",
});


  const fileId = aiFile.id;
// const fileId='file-Kmj8hZDWbK4FNp8kMLajN6'
console.log('fileId',fileId);

  return {'fileId': fileId};
  }




@Post('generateAIResponse')
@UseInterceptors(FileInterceptor('file'))
  async generateAIResponse(
    @Req() req:Request
  ) {
    // Get the authorization header from the request
    console.log('Inside generateAIResponse',req.body);
	
	
		//console.log('Inside airesponse JSON.parse',req.body);
	
  //const formData = await req.formData();
  //const file1 = req.file;
	

 const fileId=req.body.fileId;
console.log('fileId',fileId);
  // Chat Completion request
  const prompt = `
Extract and return JSON with:
- Party wise name, address, phone, email, CIN, PAN, GST and respective obligations with obligation description, obligation clauses reference and exact clause content from the uploaded document
- Agreement date and place of signing
- Supporting Documents
- Penalty clauses
- Arbitration clauses
- All clauses with clause description, clauses reference and exact clause content from the uploaded document`;


//add exact clause content against obligation clause references for each party
//add obligation clauses references in the json against each party


const tools:any = [
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
								"type": "array", "items": {"type": "object",
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
	instructions : "You are an Indian law assistant. Provide legal guidance, counter-cases under IPC, CrPC, family law, cybercrime matters, and aggressive legal strategies to help the user win a criminal or civil case. Think like a senior defense lawyer.",
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

//check to add ,	response_format: "json",
console.log(chatRes);

//const toolCall = chatRes.output?.[0]?.tool_calls?.[0];
//  if (!toolCall) {
//    return { error: "Tool call failed or schema not matched." };
//  }

//  const result = JSON.parse(toolCall.function.arguments);


const toolCalls = chatRes.output.filter(item => item.type === 'function_call');

let result:any;
toolCalls.forEach(call => {
  console.log("Tool Name:", call.name);
  console.log("call.arguments:", call.arguments);
  console.log("Arguments:", JSON.parse(call.arguments));
  result=JSON.parse(call.arguments);
  console.log("obligations:", result.obligations ? JSON.parse(result.obligations) : []);
});

//const result =chatRes.output?.[0]?.arguments;

//const result = this.extractJsonFromResponse(chatRes.output_text);
//console.log('chatRes ',extractJsonFromResponse(chatRes.output_text));

  const jsonResult = JSON.stringify(result, null, 2);
  console.log('result',jsonResult);
  this.writeJsonDatatoFile(fileId, jsonResult)
  return (jsonResult || '{}');
  }



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


  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        // Direct field names
        { name: 'coi', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'gstCert', maxCount: 1 },
        { name: 'agreementFile', maxCount: 1 },
        // Nested field names from claimant object
        { name: 'claimant.coi', maxCount: 1 },
        { name: 'claimant.panCard', maxCount: 1 },
        { name: 'claimant.gstCert', maxCount: 1 },
        { name: 'claimant.agreementFile', maxCount: 1 },
        // Supporting documents
        { name: 'supportingDocuments_0', maxCount: 1 },
        { name: 'supportingDocuments_1', maxCount: 1 },
        { name: 'supportingDocuments_2', maxCount: 1 },
        { name: 'supportingDocuments_3', maxCount: 1 },
        { name: 'supportingDocuments_4', maxCount: 1 },
        // Evidence files
        { name: 'evidenceFiles_0', maxCount: 1 },
        { name: 'evidenceFiles_1', maxCount: 1 },
        { name: 'evidenceFiles_2', maxCount: 1 },
        { name: 'evidenceFiles_3', maxCount: 1 },
        { name: 'evidenceFiles_4', maxCount: 1 },
        // Documents Evidence files
        { name: 'documentsEvidence_0_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_0_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_0_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_1_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_1_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_1_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_2_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_2_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_2_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_3_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_3_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_3_attachedDocuments_2', maxCount: 1 },
        { name: 'documentsEvidence_4_attachedDocuments_0', maxCount: 1 },
        { name: 'documentsEvidence_4_attachedDocuments_1', maxCount: 1 },
        { name: 'documentsEvidence_4_attachedDocuments_2', maxCount: 1 },
      ],
      { storage }
    )
  )
  async saveDraft(
    @Req() req,
    @Body('data') arbitrationDataString: string,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>
  ) {
    try {
      // Log the incoming request for debugging
      this.logger.log(`Saving draft with user: ${JSON.stringify(req.user)}`);
      
      // Ensure we have a valid user
      if (!req.user || !req.user.id) {
        throw new Error('Authentication required. User not found in request.');
      }
      
      // Parse the JSON data
      let arbitrationData;
      try {
        arbitrationData = JSON.parse(arbitrationDataString);
        
        // Log the parsed data for debugging
        this.logger.log('🔥 BACKEND: Parsed arbitration data keys:', Object.keys(arbitrationData));
        this.logger.log('🔥 BACKEND: natureOfDispute:', JSON.stringify(arbitrationData.natureOfDispute));
        this.logger.log('🔥 BACKEND: disputeDescriptions:', JSON.stringify(arbitrationData.disputeDescriptions));
        this.logger.log('🔥 BACKEND: documentsEvidence:', JSON.stringify(arbitrationData.documentsEvidence));
        
        // Log uploaded files for debugging
        this.logger.log('🔥 BACKEND: Uploaded files keys:', files ? Object.keys(files) : 'No files');
        if (files) {
          Object.keys(files).forEach(key => {
            const file = files[key][0];
            this.logger.log(`🔥 BACKEND: File ${key}: ${file.filename} (${file.originalname})`);
          });
        }
      } catch (e) {
        this.logger.error(`Failed to parse arbitration data: ${e.message}`);
        throw new Error('Invalid form data format');
      }
      
      // Map file paths
      const fileData = {};
      if (files) {
        this.logger.log('🔥 BACKEND: Processing files:', Object.keys(files));
        Object.keys(files).forEach(key => {
          const file = files[key][0];
          // Handle nested field names (e.g., 'claimant.coi' -> 'coi')
          const normalizedKey = key.includes('.') ? key.split('.')[1] : key;
          fileData[normalizedKey] = {
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
          };
          this.logger.log(`🔥 BACKEND: Processed file ${key} -> ${normalizedKey}: ${file.originalname}`);
        });
      }
      
      // Combine structured data with file data
      const combinedData = {
        ...arbitrationData,
        files: fileData
      };
      
      // Get user ID from request
      const userId = req.user.id;
      this.logger.log(`Saving draft for user ${userId}`);
      
      // Save to database using the new saveDraft method
      const result = await this.arbitrationService.saveDraft(combinedData, userId);
      return result;
    } catch (error) {
      this.logger.error(`Error saving draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('cases')
  async findAll(@Req() req) {
    try {
      console.log('🔧🔧🔧 ARBITRATION CONTROLLER FINDALL METHOD CALLED 🔧🔧🔧');
      console.log('🔧 Raw request user object:', JSON.stringify(req.user, null, 2));
      console.log('🔧 User ID extracted:', req.user?.id);
      console.log('🔧 User ID type:', typeof req.user?.id);
      console.log('🔧 User email:', req.user?.email);
      console.log('🔧 User role:', req.user?.role);
      
      if (!req.user || !req.user.id) {
        console.log('🔧 ERROR: No user or user ID found in request');
        throw new Error('Authentication required. User not found in request.');
      }
      
      const userId = req.user.id;
      console.log('🔧 Using userId for filtering:', userId);
      this.logger.log(`🔧 FIXED CONTROLLER - Fetching cases for user ${userId}`);
      
      // Return only cases where the user is claimant or respondent (excluding drafts)
      const result = await this.arbitrationService.findUserCases(userId);
      console.log('🔧 Service returned:', result.length, 'cases');
      console.log('🔧 First case userId (if any):', result[0]?.userId);
      console.log('🔧 All case userIds:', result.map(c => c.userId));
      this.logger.log(`🔧 CONTROLLER RETURNING ${result.length} cases to frontend`);
      return result;
    } catch (error) {
      console.log('🔧 ERROR in findAll:', error.message);
      this.logger.error(`Error fetching user cases: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('debug/cases')
  async debugCases(@Req() req) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('Authentication required. User not found in request.');
      }
      
      const userId = req.user.id;
      this.logger.log(`🧪 DEBUG: User ID is ${userId}`);
      
      // Get all cases for comparison
      const allCases = await this.arbitrationService.findAll();
      const userCases = await this.arbitrationService.findUserCases(userId);
      
      return {
        authenticatedUserId: userId,
        totalCasesInDB: allCases.length,
        userSpecificCases: userCases.length,
        allCasesPreview: allCases.slice(0, 3).map(c => ({
          id: c.id,
          userId: c.userId,
          isDraft: c.isDraft,
          status: c.status
        })),
        userCasesPreview: userCases.slice(0, 3).map(c => ({
          id: c.id,
          userId: c.userId,
          isDraft: c.isDraft,
          status: c.status
        }))
      };
    } catch (error) {
      this.logger.error(`Debug error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('drafts')
  async findUserDrafts(@Req() req) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('Authentication required. User not found in request.');
      }
      
      const userId = req.user.id;
      this.logger.log(`Fetching drafts for user ${userId}`);
      return this.arbitrationService.findUserDrafts(userId);
    } catch (error) {
      this.logger.error(`Error fetching user drafts: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('draft/:id')
  async getDraftById(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('Authentication required. User not found in request.');
      }
      
      const userId = req.user.id;
      this.logger.log(`Fetching draft ${id} for user ${userId}`);
      return this.arbitrationService.getDraftById(id, userId);
    } catch (error) {
      this.logger.error(`Error fetching draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('cases/:id')
  async findOne(@Param('id') id: string) {
    return this.arbitrationService.findOne(id);
  }

  @Get('case/:caseNumber')
  async findByCaseNumber(@Param('caseNumber') caseNumber: string) {
    return this.arbitrationService.findByCaseNumber(caseNumber);
  }

  @Put('cases/:id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() arbitrationData: Partial<ArbitrationDto>,
  ) {
    const userId = req.user.id;
    return this.arbitrationService.update(id, arbitrationData, userId);
  }

  @Put('cases/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.arbitrationService.updateStatus(id, status);
  }

  @Post('draft/:id/submit')
  async submitDraft(
    @Req() req,
    @Param('id') id: string
  ) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('Authentication required. User not found in request.');
      }
      
      const userId = req.user.id;
      this.logger.log(`Submitting draft ${id} for user ${userId}`);
      return this.arbitrationService.submitDraft(id, userId);
    } catch (error) {
      this.logger.error(`Error submitting draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('cases/:id')
  async remove(@Param('id') id: string) {
    return this.arbitrationService.delete(id);
  }

	extractJsonFromResponse(text) {
	  // Match triple backtick block
	  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	  const jsonStr = match ? match[1] : text; // fallback to full text if no match

	  try {
		return JSON.parse(jsonStr);
	  } catch (err) {
		throw new Error('Failed to parse JSON: ' + err.message);
	  }
	}


	writeJsonDatatoFile(fileId: string, data: any){

	try {
		  console.log('inside writeJsonDatatoFile');
		  const filePath = path.join(DATA_DIR, `${fileId}.json`);
		  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
		  
		  console.log('inside writeJsonDatatoFile data saved to file $filePath');
		} catch (error) {
		  throw new HttpException('Failed to save file', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

} 