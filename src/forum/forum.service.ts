import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}
}
  findAllSujets() {
    return this.prisma.sujet.findMany({
      include: {
        auteur: { select: { id:true, nom:true, prenom:true, role:true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findSujetById(id: number) {
    return this.prisma.sujet.findUnique({
      where: { id },
      include: {
        auteur: { select: { id:true, nom:true, prenom:true, role:true } },
        messages: {
          include: { auteur: { select:
            { id:true, nom:true, prenom:true, role:true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  createSujet(dto: CreateSujetDto, auteurId: number) {
    return this.prisma.sujet.create({
      data: { ...dto, auteurId },
      include: { auteur: { select:
        { id:true, nom:true, prenom:true, role:true } } },
    });
  }

  removeSujet(id: number) {
    return this.prisma.sujet.delete({ where: { id } });
  }

  // ── Messages ────────────────────────────────────────────────
  async getMessages(sujetId: number) {
    const sujet = await this.prisma.sujet.findUnique({ where: { id: sujetId } });
    if (!sujet) throw new NotFoundException('Sujet non trouve');
    return this.prisma.message.findMany({
      where: { sujetId },
      include: { auteur: { select:
        { id:true, nom:true, prenom:true, role:true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(sujetId: number, dto: CreateMessageDto, auteurId: number) {
    const sujet = await this.prisma.sujet.findUnique({ where: { id: sujetId } });
    if (!sujet) throw new NotFoundException('Sujet non trouve');
    return this.prisma.message.create({
      data: { contenu: dto.contenu, auteurId, sujetId },
      include: { auteur: { select:
        { id:true, nom:true, prenom:true, role:true } } },
    });
  }

