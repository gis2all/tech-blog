export type PostLike = {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string;
    publishedAt: Date;
    updatedAt?: Date;
    category: string;
    tags?: string[];
    cover?: string;
    coverAlt?: string;
    draft?: boolean;
    featured?: boolean;
    series?: string;
    seriesOrder?: number;
  };
};

export type TaxonomyGroup<TPost extends PostLike = PostLike> = {
  name: string;
  count: number;
  posts: TPost[];
};

export type TagDirectoryGroup<TPost extends PostLike = PostLike> = {
  initial: string;
  count: number;
  postsCount: number;
  tags: TaxonomyGroup<TPost>[];
};

export type ArchiveMonth<TPost extends PostLike = PostLike> = {
  month: number;
  label: string;
  posts: TPost[];
};

export type ArchiveYear<TPost extends PostLike = PostLike> = {
  year: number;
  months: ArchiveMonth<TPost>[];
};
