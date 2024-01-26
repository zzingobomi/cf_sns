import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { ImageModel } from 'src/common/entity/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreatePostImageDto } from './create-image.dto';
import { promises } from 'fs';

@Injectable()
export class PostsImagesService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ImageModel>(ImageModel)
      : this.imageRepository;
  }

  async createPostImage(dto: CreatePostImageDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    // dto 의 이미지 이름을 기반으로 파일의 경로를 생성한다.
    const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);

    try {
      // 파일이 존재하는지 확인. 만약에 존재하지 않는다면 에러를 던짐
      await promises.access(tempFilePath);
    } catch (e) {
      throw new BadRequestException('존재하지 않는 파일입니다.');
    }

    // 파일의 이름만 가져오기
    const fileName = basename(tempFilePath);
    const newPath = join(POST_IMAGE_PATH, fileName);

    // save
    const result = await repository.save({
      ...dto,
    });

    // 파일 옮기기
    await promises.rename(tempFilePath, newPath);

    return result;
  }
}
