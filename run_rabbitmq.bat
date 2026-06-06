@echo off
echo Starting RabbitMQ in Docker...
docker run -d --name ethesis-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
echo RabbitMQ is starting up. 
echo You can access management console at http://localhost:15672 (default user/pass: guest/guest)
pause
