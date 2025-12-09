import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGainDto } from './dto/create-gain.dto';
import { UpdateGainDto } from './dto/update-gain.dto';

@Injectable()
export class GainsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createGainDto: CreateGainDto) {
    const gain = await this.prisma.gain.create({
      data: {
        ...createGainDto,
        date: new Date(createGainDto.date),
        userId,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return gain;
  }

  async findAll(userId: number) {
    const gains = await this.prisma.gain.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return gains;
  }

  async findOne(id: number, userId: number) {
    const gain = await this.prisma.gain.findUnique({
      where: { id },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!gain) {
      throw new NotFoundException(`Entrada com ID ${id} não encontrada`);
    }

    if (gain.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta entrada');
    }

    return gain;
  }

  async update(id: number, userId: number, updateGainDto: UpdateGainDto) {
    // Verifica se a entrada existe e pertence ao usuário
    await this.findOne(id, userId);

    const gain = await this.prisma.gain.update({
      where: { id },
      data: {
        ...updateGainDto,
        ...(updateGainDto.date && { date: new Date(updateGainDto.date) }),
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return gain;
  }

  async remove(id: number, userId: number) {
    // Verifica se a entrada existe e pertence ao usuário
    await this.findOne(id, userId);

    await this.prisma.gain.delete({
      where: { id },
    });

    return { message: 'Entrada removida com sucesso' };
  }
}

