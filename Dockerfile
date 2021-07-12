FROM alpine
COPY .npmrc /root/
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories&&apk add --no-cache nodejs npm && npm install whistle -g && apk del npm && mkdir /whistle
CMD w2 run -M prod -D /whistle
EXPOSE 8899
