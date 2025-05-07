import { Controller, Get, Post, Body } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get()
  getData() {
    return this.dataService.getData();
  }

  @Post()
  postData(@Body() data: any) {
    return this.dataService.postData(data);
  }
}