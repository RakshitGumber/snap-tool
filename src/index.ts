import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { openapi, fromTypes } from '@elysiajs/openapi'

export const app = new Elysia()
	.use(
		openapi({
			references: fromTypes()
		})
	)
	.use(
		await staticPlugin({
			prefix: '/'
		})
	)
	.listen(3000)

console.log(
	`Application is running at http://${app.server?.hostname}:${app.server?.port}`
)
