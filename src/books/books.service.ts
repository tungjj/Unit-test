import { GetBookByIdDto } from './dto/get-book-by-id.dto';
import { GetBookDto } from './dto/get-book.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import * as admin from 'firebase-admin';
import * as moment from 'moment';
import { QuerySnapshot } from '@google-cloud/firestore';
@Injectable()
export class BooksService {
  private db = admin.firestore();
  async create(createBookDto: CreateBookDto) {
    try {
      const { userId, name } = createBookDto;

      const getUser = await this.db.collection('users').doc(`${userId}`).get();
      if (!getUser.exists) {
        throw new NotFoundException('Not found this author.');
      }
      const author = getUser.data().name;
      const newBook = {
        name,
        author,
        userId,
        createdAt: +moment.utc().format('x'),
        updatedAt: +moment.utc().format('x'),
      };
      await this.db.collection('books').add(newBook);

      return newBook;
    } catch (error) {
      return error.response;
    }
  }

  async findAll(query: GetBookDto) {
    const { limit, startAfter } = query;

    let querySnapshot;
    if (!startAfter) {
      querySnapshot = await this.db
        .collection('books')
        .orderBy('createdAt')
        .limit(+limit)
        .get();
    }
    if (startAfter) {
      querySnapshot = await this.db
        .collection('books')
        .orderBy('createdAt')
        .limit(+limit)
        .startAfter(+startAfter)
        .get();
    }

    // let querySnapshot = this.db.collection('books').orderBy('createdAt').limit(+limit);
    const books = querySnapshot.docs.map((doc) => {
      return { bookId: doc.id, ...doc.data() };
    });
    return books;

    //# new way of Billy
    // let bookRef = this.db.collection('books').orderBy('createdAt');
    // if (startAfter) {
    //   bookRef = bookRef.limit(+limit).startAfter(+startAfter);
    // }

    // if (!startAfter) {
    //   bookRef = bookRef.limit(+limit);
    // }

    // const querySnapshot = await bookRef.get();

    // const userDocs = await querySnapshot.docs;
    // const users = [];
    // const res = userDocs.forEach((doc) => {
    //   users.push({ userId: doc.id, ...doc.data() });
    //   // return { userId: doc.id, ...doc.data() };
    // });
    // return users;
  }
  // returnFromMapFunction(doc) {
  //   return { userId: doc.id, ...doc.data() };
  // }
  async findOne(id: string) {
    try {
      const getBook = await this.db.collection('books').doc(id).get();
      if (!getBook.exists) {
        throw new NotFoundException('Not found book.');
      }
      const result = { bookId: id, ...getBook.data() };
      return result;
    } catch (error) {
      return error.response;
    }
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    try {
      const getBook = await this.db.collection('books').doc(id).get();

      if (!getBook.exists) {
        throw new NotFoundException('Not found book.');
      }
      const request = await this.db
        .collection('books')
        .doc(id)
        .set(
          {
            ...updateBookDto,
            updatedAt: +moment.utc().format('x'),
          },
          { merge: true },
        );
      return `This action updates a #${id} book`;
    } catch (error) {
      return error.response;
    }
  }

  async remove(id: string) {
    try {
      const getBook = await this.db.collection('books').doc(id).get();

      if (!getBook.exists) {
        throw new NotFoundException('Not found book.');
      }
      const querySnapshot = await this.db.collection('books').doc(id).delete();
      return `This action removes a #${id} book`;
    } catch (error) {
      return error.response;
    }
  }
  async findByUserId(id: string, getBookByIdDto: GetBookByIdDto) {
    try {
      const { sort, limit, startAfter } = getBookByIdDto;
      let querySnapshot;

      const user = await this.db.collection('users').doc(id).get();
      if (!user.exists) {
        throw new NotFoundException('Not found this user.');
      }
      if (startAfter) {
        querySnapshot = await this.db
          .collection('books')
          .orderBy('createdAt', sort)
          .limit(+limit)
          .where('userId', '==', id)
          .startAfter(+startAfter)
          .get();
      }
      if (!startAfter) {
        querySnapshot = await this.db
          .collection('books')
          .orderBy('createdAt', sort)
          .limit(+limit)
          .where('userId', '==', id)
          .get();
      }
      const books = querySnapshot.docs.map((doc) => {
        return { bookId: doc.id, ...doc.data() };
      });
      return books;
    } catch (error) {
      return error.response;
    }
  }
}
