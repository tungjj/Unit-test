import { UsersController } from '../src/users/users.controller';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import { CreateUserDto, UserGender } from '../src/users/dto/create-user.dto';
import { UsersService } from '../src/users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import * as admin from 'firebase-admin';

const mockId = 'alan';
const docData = {
  name: 'test data',
  age: 15,
  gender: 'Male',
  createdAt: 1654674963954,
  updatedAt: 1654674963954,
};
const arrayData = [docData, docData, docData];

const docResult = {
  exists: true,
  id: mockId,
  data: () => docData,
  forEach: jest.fn(),
};
const mockArrayResult = {
  exists: true,
  id: mockId,
  data: () => arrayData,
  forEach: jest.fn(),
  docs: {
    map: jest.fn(() => arrayData),
  },
  // docs: jest.fn(() => ({
  //   forEach: jest.fn(() => Promise.resolve(mockArrayResult)),
  // })),
};
const notExistResult = {
  exists: false,
  id: mockId,
  data: () => null,
  forEach: jest.fn(),
};
const mockedGetLimit = {
  get: jest.fn(() => Promise.resolve(arrayData)),
};
const mockedGetForMap = {
  get: jest.fn(() => Promise.resolve(mockArrayResult)),
};
const mockedSet = {
  set: jest.fn(),
};
const mockedGet = {
  get: jest.fn(() => Promise.resolve(docResult)),
};
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              get: mockedGet.get,
            })),
          })),
        })),
        limit: jest.fn(() => ({
          get: mockedGetForMap.get,
          startAfter: jest.fn(() => ({
            get: mockedGetForMap.get,
          })),
        })),
      })),
      doc: jest.fn((param) => ({
        // get: jest.fn(),
        get: mockedGet.get,
        set: mockedSet.set,
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn(),
            get: mockedGet.get,
            delete: jest.fn(),
          })),
          add: jest.fn(() => ({
            get: mockedGet.get,
          })),
          get: mockedGet.get,
        })),
        delete: jest.fn(),
      })),
      add: jest.fn(() => ({
        collection: jest.fn(() => ({
          add: jest.fn(() => ({
            get: mockedGet.get,
          })),
        })),
      })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              get: mockedGet.get,
            })),
          })),
        })),
        get: mockedGet.get,
      })),
      limit: jest.fn(() => mockedGetLimit.get),
    })),
  })),
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
}));

describe('UserService', () => {
  let usersService: UsersService;
  let usersController: UsersController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    usersController = moduleRef.get<UsersController>(UsersController);
  });

  describe('findOne', () => {
    it('user service should be called ', async () => {
      const spy = jest.spyOn(usersService, 'findOne');
      const result = await usersService.findOne('Uk9GxnKpJ2OJH9CQEOCq');

      expect(spy).toBeCalled();
    });
    it('should return error', async () => {
      mockedGet.get.mockResolvedValueOnce(notExistResult);
      const res = await usersService.findOne('a');
      const result = res.status;

      expect(result).toBe(404);
    });
    it('it should return docData', async () => {
      // mockedGet.get.mockResolvedValueOnce(docResult);
      const res = await usersService.findOne('alan');
      expect(res).toBe(docResult.data());
    });
  });
  describe('create', () => {
    it('user should be create', async () => {
      const mockResult = {
        name: 'string',
        age: 0,
        gender: 'Male',
      };
      const spy = jest.spyOn(usersService, 'create');
      const result = await usersService.create({
        name: 'string',
        age: 0,
        gender: UserGender.Male,
      });
      expect(spy).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
    it('should be error when pass age < 0', async () => {
      // mockedGet.get.mockResolvedValueOnce(docResult);

      const result2 = await usersService.create({
        name: 'string',
        age: -1,
        gender: UserGender.Male,
      });
      expect(result2.statusCode).toBe(400);
    });
  });
  describe('update', () => {
    it('update successfully', async () => {
      mockedGet.get.mockResolvedValueOnce(docResult);
      const res = await usersService.update('alan', {
        age: 13,
        name: 'tung',
        gender: UserGender.Male,
      });
      expect(res).toBe('Update user id: alan successfully.');
    });
  });
  describe('delete', () => {
    it('should delete successfully', async () => {
      const res = await usersService.remove('alan');
      expect(res).toBe(`This action removes a #alan user`);
    });
    it('should throw not found user', async () => {
      mockedGet.get.mockResolvedValueOnce(notExistResult);
      const res = await usersService.remove('abc');
      expect(res.statusCode).toBe(404);
    });
  });
  describe('findAll', () => {
    it('pass limit => should return an array', async () => {
      const res = await usersService.findAll({ page: 0, limit: 1 });
      expect(res).toEqual(arrayData);
    });
    it('pass page + limit => should return an array', async () => {
      const res = await usersService.findAll({ page: 2, limit: 1 });
      expect(res).toEqual(arrayData);
    });
  });
});
