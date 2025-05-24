import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  async getProfile(@Request() req) {
    // Get current user profile using JWT token
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);
    
    // Remove password from response
    const { password, ...userProfile } = user;
    return userProfile;
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    // Update current user's profile
    const userId = req.user.id;
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    
    // Remove password from response
    const { password, ...userProfile } = updatedUser;
    return {
      message: 'Profile updated successfully',
      user: userProfile
    };
  }

  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.id;
    await this.usersService.changePassword(userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}