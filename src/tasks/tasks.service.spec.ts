import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './task.entity';

const mockUser = (() => {
  const user = new User();
  user.username = 'johndoe';
  return user;
})();

const mockTask = (() => {
  const task = new Task();
  task.title = 'task title';
  task.description = 'task desc';
  return task;
})();

const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

describe('TasksService', () => {
  let tasksService: TasksService;
  let taskRepository: TaskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    taskRepository = module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks', () => {
    it('gets all tasks from the repository', async () => {
      const response = 'all tasks';
      const filters: GetTasksFilterDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'Example',
      };

      (taskRepository.getTasks as jest.Mock).mockResolvedValue(response);
      const result = await tasksService.getTasks(filters, mockUser);

      expect(taskRepository.getTasks).toHaveBeenCalledWith(filters, mockUser);
      expect(result).toEqual(response);
    });
  });

  describe('getTaskById', () => {
    it('successfully retrieves and returns tasks', async () => {
      (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
      const result = await tasksService.getTask(mockTask.id, mockUser);

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTask.id, userId: mockUser.id },
      });
    });

    it('throws an exception when task is not found', async () => {
      (taskRepository.findOne as jest.Mock).mockResolvedValue(null);

      expect(tasksService.getTask(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask', () => {
    it('successfully creates a task', async () => {
      const response = 'a task';
      const taskDto: CreateTaskDto = {
        title: mockTask.title,
        description: mockTask.description,
      };

      (taskRepository.createTask as jest.Mock).mockResolvedValue(response);
      const result = await tasksService.createTask(taskDto, mockUser);

      expect(result).toEqual(response);
      expect(taskRepository.createTask).toHaveBeenCalledWith(taskDto, mockUser);
    });
  });

  describe('deleteTask', () => {
    it('successfully deletes a task', async () => {
      (taskRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      await tasksService.deleteTask(mockTask.id, mockUser);

      expect(taskRepository.delete).toHaveBeenCalledWith({
        id: mockTask.id,
        userId: mockUser.id,
      });
    });

    it('throws an exception when not task deleted', async () => {
      (taskRepository.delete as jest.Mock).mockResolvedValue({ affected: 0 });

      expect(tasksService.deleteTask(mockTask.id, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('updates the task status', async () => {
      const save = jest.fn().mockResolvedValue(true);

      tasksService.getTask = jest.fn().mockResolvedValue({
        status: mockTask.status,
        save,
      });

      const result = await tasksService.updateTaskStatus(
        mockTask.id,
        TaskStatus.IN_PROGRESS,
        mockUser,
      );

      expect(tasksService.getTask).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.IN_PROGRESS);
      expect(save).toHaveBeenCalled();
    });
  });
});
