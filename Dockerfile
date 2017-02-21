FROM python:3.5
ENV PYTHONUNBUFFERED 1

RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 && chmod +x /usr/local/bin/dumb-init

RUN mkdir /code
WORKDIR /code
ADD requirements.txt /code/
RUN pip install -r requirements.txt

ADD . /code/

RUN python manage.py collectstatic --no-input

RUN add-apt-repository ppa:mc3man/trusty-media
RUN apt-get install ffmpeg