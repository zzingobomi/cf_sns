import { Controller, Get } from '@nestjs/common';
import { PostsService } from './posts.service';

/**
 * author: string;
 * title: string;
 * content: string;
 * likeCount: number;
 * commentCount: number;
 */

interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[] = [
  {
    id: 1,
    author: 'zzingo',
    title: '포스트1',
    content: '포스트1 내용',
    likeCount: 10000,
    commentCount: 9999,
  },
  {
    id: 2,
    author: 'zzingo2',
    title: '포스트2',
    content: '포스트2 내용',
    likeCount: 10002,
    commentCount: 9992,
  },
  {
    id: 3,
    author: 'zzingo3',
    title: '포스트3',
    content: '포스트3 내용',
    likeCount: 10003,
    commentCount: 9993,
  },
];

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts() {
    return posts;
  }
}
