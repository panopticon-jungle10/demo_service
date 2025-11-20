export class UpdatePostDto {
  password: string;
  title?: string;
  content?: string;
  email?: string;
  authorName?: string;
  isPrivate?: boolean;
  isAnonymous?: boolean;
}
