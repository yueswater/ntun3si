.PHONY: install dev-server dev-client build clean logs deploys

RENDER_SERVICE_ID = srv-d41qqhbe5dus73f648pg

# 安裝前後端所有相依套件（含 devDependencies）
install:
	npm install --include=dev
	npm install --include=dev --prefix src/client

# 啟動後端伺服器
dev-server:
	npm run server

# 啟動前端開發伺服器
dev-client:
	npm run client

# 建置專案（等同 render-build.sh 的流程）
build:
	npm install --include=dev
	npm install --include=dev --prefix src/client
	npm run build --prefix src/client
	node generate-sitemap.js

# 清除所有 node_modules
clean:
	rm -rf node_modules
	rm -rf src/client/node_modules

# 查看 Render 即時 logs
logs:
	render logs $(RENDER_SERVICE_ID)

# 查看最近部署紀錄
deploys:
	render deploys list $(RENDER_SERVICE_ID)
