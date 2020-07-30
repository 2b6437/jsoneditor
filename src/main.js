import JSONEditor from './components/JSONEditor.svelte'

export default function jsoneditor (config) {
	return new JSONEditor(config)
}

export { createAjvValidator } from './plugins/createAjvValidator.mjs'
