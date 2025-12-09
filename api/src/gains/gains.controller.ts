import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { GainsService } from './gains.service';
import { CreateGainDto } from './dto/create-gain.dto';
import { UpdateGainDto } from './dto/update-gain.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gains')
@UseGuards(JwtAuthGuard)
export class GainsController {
  constructor(private readonly gainsService: GainsService) {}

  @Post()
  create(@Request() req, @Body() createGainDto: CreateGainDto) {
    return this.gainsService.create(req.user.id, createGainDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.gainsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gainsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGainDto: UpdateGainDto,
  ) {
    return this.gainsService.update(id, req.user.id, updateGainDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gainsService.remove(id, req.user.id);
  }
}
