import { IsString } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class PostsModel extends BaseModel {
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;

  @Column()
  @IsString({
    message: 'title은 string 타입을 입력 해줘야 합니다.',
  })
  title: string;

  @Column()
  @IsString({
    message: 'content는 string 타입을 입력 해줘야 합니다.',
  })
  content: string;

  @Column({
    nullable: true,
  })
  image?: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;
}
