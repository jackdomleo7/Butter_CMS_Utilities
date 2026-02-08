export namespace Butter {
  export interface Response<Data> {
    data: Data
    meta: {
      next_page: number | null
      previous_page: number | null
      count: number
    }
  }

  export interface Category<CategorySlug extends string = string> {
    name: string
    slug: CategorySlug
    recent_posts?: Post[]
  }

  export interface Tag<TagSlug extends string = string> {
    name: string
    slug: TagSlug
    recent_posts?: Post[]
  }

  export interface Author<AuthorSlug extends string = string> {
    first_name: string
    last_name: string
    email: string
    slug: AuthorSlug
    bio: string
    title: string
    linkedin_url: string
    facebook_url: string
    pinterest_url: string
    instagram_url: string
    twitter_handle: string
    profile_image: string
    recent_posts?: Post[]
  }

  export interface Post<AuthorSlug extends string = string, PostSlug extends string = string> {
    author: Omit<Butter.Author<AuthorSlug>, 'recent_posts'>
    body?: string
    categories: Butter.Category[]
    created: string
    featured_image: string | null
    featured_image_alt: string
    meta_description: string
    published: string | null
    scheduled: string | null
    seo_title: string
    slug: PostSlug
    status: 'published' | 'draft' | 'scheduled'
    summary: string
    tags: Butter.Tag[]
    title: string
    updated: string | null
    url: string
  }

  export interface Page<
    PageModel extends object = object,
    PageType extends string = string,
    PageSlug extends string = string,
  > {
    fields: PageModel
    name: string
    page_type: PageType
    published: string | null
    scheduled: string | null
    slug: PageSlug
    status: 'published' | 'draft' | 'scheduled'
    updated: string | null
  }

  export interface Collection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
}
