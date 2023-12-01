redeploy:
	sudo docker compose down
	sudo docker compose build
	sudo docker compose up -d
	sudo docker compose logs -f
