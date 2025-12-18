import { Controller, Post, Body, Req, Get, Query, } from '@nestjs/common';
import { EventsService } from './events.service';
import { Roles } from '../auth/roles.decorator';
import { GetEventsDto } from './dto/get-events.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Roles('system', 'operator', 'partner')
  @Get()
  async getEvents(
    @Query() query: GetEventsDto,
    @Req() req: any,
  ) {
    return this.eventsService.findAll(query, req.user);
  }

  @Roles('system', 'operator', 'partner')
  @Post()
  async createEvent(@Body() body: any, @Req() req: any) {
    return this.eventsService.create(body, req.user);
  }
}