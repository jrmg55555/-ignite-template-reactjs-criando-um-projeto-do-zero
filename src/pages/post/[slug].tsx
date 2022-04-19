import Prismic from '@prismicio/client';
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface Content {
  heading: string;
  body: {
    text: string;
  }[];
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  function timeToRead(content: Content[]) {
    const text = content.reduce((text, post) => {
      return text + RichText.asText(post.body);
    }, '');

    const timeReadText = Math.ceil(text?.split(' ').length / 200);

    return timeReadText;
  }

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header />

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />

      {!post.data.title && <h1>Carregando...</h1>}

      <main className={styles.container}>
        <article className={styles.post}>
          <header>
            <h1>{post.data.title}</h1>
            <div className={styles.postInfo}>
              <span>
                <FiCalendar size={20} />
                {format(
                  new Date(post.first_publication_date),
                  'dd MMM yyyy',
                  {
                    locale: ptBR
                  }
                )}
              </span>
              <span>
                <FiUser size={20} />
                {post.data.author}
              </span>
              <span>
                <FiClock size={20} />
                {timeToRead(post.data.content)} min
              </span>
            </div>
          </header>

          <section className={styles.postContent}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h1>{content.heading}</h1>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </section>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 3,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    }
  }));

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID<any>('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(item => ({
        heading: item.heading,
        body: item.body
      }))
    }
  }

  return {
    props: {
      post
    },
    revalidate: 10 //10 seconds
  }
};
