import fastify, { RequestGenericInterface } from 'fastify';
import axios from "axios";

const server = fastify();

interface SearchRequest extends RequestGenericInterface {
  Querystring: {
    q: string
  }
}

server.get<SearchRequest>('/search', async (request, reply) => {
  return axios.get("https://api.themoviedb.org/3/search/movie", {
    headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' }, // workaround for gzip encoding bug
    params: {api_key: process.env.TMDB_API_KEY, query: request.query.q}
  })
  .then(res => res.data)
})

interface DetailRequest extends RequestGenericInterface {
  Querystring: {
    id: number
  }
}

server.get<DetailRequest>('/detail', async (request, reply) => {
  return axios.get(`https://api.themoviedb.org/3/movie/${request.query.id}`, {
    headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' }, // workaround for gzip encoding bug
    params: {api_key: process.env.TMDB_API_KEY}
  })
  .then(res => res.data)
  .then(tmdb_res_data => {
    return axios.get(`https://imdb-api.com/en/API/Wikipedia/${process.env.IMDB_API_KEY}/${tmdb_res_data.imdb_id}`, {
      headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' }, // workaround for gzip encoding bug
    })
    .then(imdb_api_res => {
      return {
        imdb_api: imdb_api_res.data,
        ...tmdb_res_data,
      }
    })
  })
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (process.env.TMDB_API_KEY === undefined) {
    console.error("TMDB_API_KEY (v3) environment variable missing");
    process.exit(1);
  }
  if (process.env.IMDB_API_KEY === undefined) {
    console.error("IMDB_API_KEY environment variable missing");
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
