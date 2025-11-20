export class CreatePostDto {
  title: string;
  content: string;
  password: string;
  email?: string;
  authorName?: string;
  isPrivate?: boolean;
  isAnonymous?: boolean;
}
