import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {
    // Create uploads directory if it doesn't exist
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadDocuments(caseId: string, files: Express.Multer.File[]): Promise<Document[]> {
    const savedDocuments: Document[] = [];

    for (const file of files) {
      // Generate unique filename
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Create document record
      const document = this.documentsRepository.create({
        caseId,
        originalName: file.originalname,
        filename: uniqueFilename,
        path: filePath,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      });

      const savedDocument = await this.documentsRepository.save(document);
      savedDocuments.push(savedDocument);
    }

    return savedDocuments;
  }

  async getDocumentsByCaseId(caseId: string): Promise<Document[]> {
    return this.documentsRepository.find({ where: { caseId } });
  }

  async getDocumentById(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const document = await this.getDocumentById(id);

    // Delete file from disk
    try {
      fs.unlinkSync(document.path);
    } catch (error) {
      // File might already be deleted, continue with DB deletion
      console.error(`Error deleting file: ${error.message}`);
    }

    // Delete from database
    await this.documentsRepository.remove(document);

    return { success: true, message: 'Document deleted successfully' };
  }
}