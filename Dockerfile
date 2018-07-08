FROM node:10
WORKDIR /var/imgshare_svr
COPY . /var/imgshare_svr

RUN npm install
EXPOSE 8000
CMD ["npm", "start"]
RUN echo 'Be sure to set the .env file up'