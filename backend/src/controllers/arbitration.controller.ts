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
  Req,
  Logger,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ArbitrationService } from '../services/arbitration.service';
import { ArbitrationDto } from '../dto/arbitration.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

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
        { name: 'coi', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'gstCert', maxCount: 1 },
        { name: 'agreementFile', maxCount: 1 },
        { name: 'supportingDocuments_0', maxCount: 1 },
        { name: 'supportingDocuments_1', maxCount: 1 },
        { name: 'supportingDocuments_2', maxCount: 1 },
        { name: 'supportingDocuments_3', maxCount: 1 },
        { name: 'supportingDocuments_4', maxCount: 1 },
        { name: 'evidenceFiles_0', maxCount: 1 },
        { name: 'evidenceFiles_1', maxCount: 1 },
        { name: 'evidenceFiles_2', maxCount: 1 },
        { name: 'evidenceFiles_3', maxCount: 1 },
        { name: 'evidenceFiles_4', maxCount: 1 },
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
          fileData[key] = {
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

  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coi', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'gstCert', maxCount: 1 },
        { name: 'agreementFile', maxCount: 1 },
        { name: 'supportingDocuments_0', maxCount: 1 },
        { name: 'supportingDocuments_1', maxCount: 1 },
        { name: 'supportingDocuments_2', maxCount: 1 },
        { name: 'supportingDocuments_3', maxCount: 1 },
        { name: 'supportingDocuments_4', maxCount: 1 },
        { name: 'evidenceFiles_0', maxCount: 1 },
        { name: 'evidenceFiles_1', maxCount: 1 },
        { name: 'evidenceFiles_2', maxCount: 1 },
        { name: 'evidenceFiles_3', maxCount: 1 },
        { name: 'evidenceFiles_4', maxCount: 1 },
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
      } catch (e) {
        this.logger.error(`Failed to parse arbitration data: ${e.message}`);
        throw new Error('Invalid form data format');
      }
      
      // Map file paths
      const fileData = {};
      if (files) {
        Object.keys(files).forEach(key => {
          const file = files[key][0];
          fileData[key] = {
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
  async findAll() {
    return this.arbitrationService.findAll();
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
} 