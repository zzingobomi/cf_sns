import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entity/posts.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import { ImageModel } from 'src/common/entity/image.entity';
import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS,
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
      {
        ...DEFAULT_POST_FIND_OPTIONS,
      },
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

  async getPostById(id: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const post = await repository.findOne({
      ...DEFAULT_POST_FIND_OPTIONS,
      where: {
        id,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<PostsModel>(PostsModel)
      : this.postsRepository;
  }

  async createPost(authorId: number, postDto: CreatePostDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);
    const post = repository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      images: [],
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await repository.save(post);

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

  async checkPostExistsById(id: number) {
    return this.postsRepository.exists({
      where: {
        id,
      },
    });
  }

  async isPostMine(userId: number, postId: number) {
    return this.postsRepository.exists({
      where: {
        id: postId,
        author: {
          id: userId,
        },
      },
      relations: {
        author: true,
      },
    });
  }
}
