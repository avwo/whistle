FROM alpine
EXPOSE 8899
RUN apk add --no-cache nodejs npm \
    && npm install whistle -g \
    && apk del npm \
    && mkdir /whistle
ENTRYPOINT ["w2", "run", "-M","prod", "-D","/whistle"]
