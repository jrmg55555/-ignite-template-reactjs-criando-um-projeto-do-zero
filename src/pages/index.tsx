import Prismic from "@prismicio/client";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from "../components/Header";
import { getPrismicClient } from "../services/prismic";
import styles from "./home.module.scss";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  function formatDate(date: string): string {
    return format(
      new Date(date),
      'dd MMM yyyy',
      {
        locale: ptBR
      }
    )
  }

  async function handleLoadMore() {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const nextPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author
            }
          }
        })

        setPosts([...posts, ...nextPosts]);
        setNextPage(data.next_page);
      })
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>

                <div>
                  <span>
                    <FiCalendar size={16} color="#fff" />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR
                      }
                    )}
                  </span>
                  <span>
                    <FiUser size={16} color="#fff" />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {nextPage &&
            <button
              type="button"
              onClick={handleLoadMore}
            >
              Carregar mais posts
            </button>
          }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query<any>([
    Prismic.Predicates.at("document.type", "posts"),
  ], {
    pageSize: 3,
  });

  const { next_page } = postsResponse;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page,
      },
    }
  }
};
