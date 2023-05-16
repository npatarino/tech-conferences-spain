FROM ruby:2.7.7-alpine
RUN apk add --no-cache g++ musl-dev make libstdc++ wget imagemagick

WORKDIR /usr/src/app

COPY Gemfile ./
RUN bundle install

COPY . .
