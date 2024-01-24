import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import { promises } from 'fs';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { basename, join } from 'path';

/**
 * author: string;
 * title: string;
 * content: string;
 * likeCount: number;
 * commentCount: number;
 */

export interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

// let posts: PostModel[] = [
//   {
//     id: 1,
//     author: 'zzingo',
//     title: '포스트1',
//     content: '포스트1 내용',
//     likeCount: 10000,
//     commentCount: 9999,
//   },
//   {
//     id: 2,
//     author: 'zzingo2',
//     title: '포스트2',
//     content: '포스트2 내용',
//     likeCount: 10002,
//     commentCount: 9992,
//   },
//   {
//     id: 3,
//     author: 'zzingo3',
//     title: '포스트3',
//     content: '포스트3 내용',
//     likeCount: 10003,
//     commentCount: 9993,
//   },
// ];

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
  }

  // TODO:
  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의로 생성된 포스트 제목 ${i}`,
        content: `임의로 생성된 포스트 내용 ${i}`,
        images: [],
      });
    }
  }

  async paginatePosts(dto: PaginatePostDto) {
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      { relations: ['author'] },
      'posts',
    );
    // if (dto.page) {
    //   return this.pagePaginatePosts(dto);
    // } else {
    //   return this.cursorPaginatePosts(dto);
    // }
  }

  // async pagePaginatePosts(dto: PaginatePostDto) {
  //   const [posts, count] = await this.postsRepository.findAndCount({
  //     skip: dto.take * (dto.page - 1),
  //     take: dto.take,
  //     order: {
  //       createdAt: dto.order__createdAt,
  //     },
  //   });

  //   return {
  //     data: posts,
  //     total: count,
  //   };
  // }

  // async cursorPaginatePosts(dto: PaginatePostDto) {
  //   const where: FindOptionsWhere<PostsModel> = {};

  //   if (dto.where__id__less_than) {
  //     where.id = LessThan(dto.where__id__less_than);
  //   } else if (dto.where__id__more_than) {
  //     where.id = MoreThan(dto.where__id__more_than);
  //   }

  //   const posts = await this.postsRepository.find({
  //     where,
  //     order: {
  //       createdAt: dto.order__createdAt,
  //     },
  //     take: dto.take,
  //   });

  //   // 해당되는 포스트가 0개 이상이면 마지
  //   const lastItem =
  //     posts.length > 0 && posts.length === dto.take
  //       ? posts[posts.length - 1]
  //       : null;

  //   const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
  //   const host = this.configService.get<string>(ENV_HOST_KEY);

  //   const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);
  //   if (nextUrl) {
  //     for (const key of Object.keys(dto)) {
  //       if (dto[key]) {
  //         if (
  //           key !== 'where__id__more_than' &&
  //           key !== 'where__id__less_than'
  //         ) {
  //           nextUrl.searchParams.append(key, dto[key]);
  //         }
  //       }
  //     }

  //     let key = null;

  //     if (dto.order__createdAt === 'ASC') {
  //       key = 'where__id__more_than';
  //     } else {
  //       key = 'where__id__less_than';
  //     }

  //     nextUrl.searchParams.append(key, lastItem.id.toString());
  //   }

  //   /**
  //    * Response
  //    *
  //    * data: Data[]
  //    * cursor: {
  //    *    after: 마지막 Data의 ID
  //    * },
  //    * count: 응답한 데이터의 갯수
  //    * next: 다음 요청을 할때 사용할 URL
  //    */
  //   return {
  //     data: posts,
  //     cursor: {
  //       after: lastItem?.id ?? null,
  //     },
  //     count: posts.length,
  //     next: nextUrl?.toString() ?? null,
  //   };
  // }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  async createPostImage(dto: CreatePostDto) {
    // dto 의 이미지 이름을 기반으로 파일의 경로를 생성한다.
    const tempFilePath = join(TEMP_FOLDER_PATH, dto.image);

    try {
      // 파일이 존재하는지 확인. 만약에 존재하지 않는다면 에러를 던짐
      await promises.access(tempFilePath);
    } catch (e) {
      throw new BadRequestException('존재하지 않는 파일입니다.');
    }

    // 파일의 이름만 가져오기
    const fileName = basename(tempFilePath);
    const newPath = join(POST_IMAGE_PATH, fileName);

    await promises.rename(tempFilePath, newPath);

    return true;
  }

  // TODO:
  async createPost(authorId: number, postDto: CreatePostDto) {
    const post = this.postsRepository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(postId: number, postDto: UpdatePostDto) {
    const { title, content } = postDto;
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(postId: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(postId);

    return postId;
  }
}
