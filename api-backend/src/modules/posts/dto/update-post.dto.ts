export class UpdatePostDto {
  password: string;
  authorName: string;
  title?: string;
  content?: string;
  email?: string;
  isPrivate?: boolean;
  isAnonymous?: boolean;
}
