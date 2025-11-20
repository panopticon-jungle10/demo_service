export class CreatePostDto {
  title: string;
  content: string;
  password: string;
  authorName: string;
  email?: string;
  isPrivate?: boolean;
  isAnonymous?: boolean;
}
