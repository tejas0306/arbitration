import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post(':caseId/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 },
    ]),
  )
  async uploadDocument(
    @Param('caseId') caseId: string,
    @UploadedFiles() files: { files: Express.Multer.File[] },
  ) {
    return this.documentsService.uploadDocuments(caseId, files.files);
  }

  @Get(':caseId')
  async getDocuments(@Param('caseId') caseId: string) {
    return this.documentsService.getDocumentsByCaseId(caseId);
  }

  @Get('download/:id')
  async downloadDocument(@Param('id') id: string, @Res() res) {
    const document = await this.documentsService.getDocumentById(id);
    return res.download(document.path, document.originalName);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }
}