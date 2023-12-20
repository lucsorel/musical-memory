FROM python:3.11-slim

# where the application code will be copied to
ENV APP_PATH="/app"
RUN mkdir -p $APP_PATH
WORKDIR $APP_PATH

COPY web ./

ENTRYPOINT ["python", "-m", "http.server", "8080"]
