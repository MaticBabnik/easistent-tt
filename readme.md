# easistent-tt
GraphQL API for easistent's public timetable data.

## API docs
are available on any instance by simply visiting it in a browser

## Development
```bash
# Install deps with
npm i
# then
npm run watch
```
Then you can point your browser to `http://localhost:<PORT>` and use Apollo's query thingy.
In production it's replaced by GraphiQL

## Docker
```bash
# build the image
docker build -t easistent-tt .

# start the container
docker run -dit \
  --name easistent-tt -p 3456:3456 \
  --mount type=bind,source="$(pwd)/config.json",target=/app/config.json \
  easistent-tt
```