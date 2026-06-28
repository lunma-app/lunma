/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ modifier: NonNullable<unknown> }} Options_Shortcutdescription1Inputs */

const en_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L isn't currently bound. Your browser has to set the keyboard shortcut — open its shortcuts page to bind it.`)
};

const es_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L no está asignado. Tu navegador debe configurar el atajo de teclado — abre su página de atajos para asignarlo.`)
};

const pt_pt2_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L não está atribuído. O browser tem de definir o atalho de teclado — abra a página de atalhos para o configurar.`)
};

const fr_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L n'est pas encore assigné. Votre navigateur gère les raccourcis clavier — ouvrez sa page de raccourcis pour l'assigner.`)
};

const de_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L ist noch nicht belegt. Der Browser legt das Tastenkürzel fest — die Shortcuts-Seite öffnen, um es zu belegen.`)
};

const ja_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L は現在バインドされていません。ブラウザでキーボードショートカットを設定する必要があります — ショートカットページを開いてバインドしてください。`)
};

const ko_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L이 현재 할당되지 않았습니다. 브라우저에서 키보드 단축키를 설정해야 합니다 — 단축키 페이지를 열어 할당하세요.`)
};

const zh_cn2_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L 当前未绑定。需在浏览器中设置键盘快捷键 — 打开快捷键页面进行绑定`)
};

const ru_options_shortcutdescription1 = /** @type {(inputs: Options_Shortcutdescription1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.modifier}L не назначена. Горячую клавишу задаёт браузер — откройте страницу сочетаний клавиш, чтобы назначить её.`)
};

/**
* | output |
* | --- |
* | "{modifier}L isn't currently bound. Your browser has to set the keyboard shortcut — open its shortcuts page to bind it." |
*
* @param {Options_Shortcutdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_shortcutdescription1 = /** @type {((inputs: Options_Shortcutdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Shortcutdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_shortcutdescription1(inputs)
	if (locale === "es") return es_options_shortcutdescription1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_shortcutdescription1(inputs)
	if (locale === "fr") return fr_options_shortcutdescription1(inputs)
	if (locale === "de") return de_options_shortcutdescription1(inputs)
	if (locale === "ja") return ja_options_shortcutdescription1(inputs)
	if (locale === "ko") return ko_options_shortcutdescription1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_shortcutdescription1(inputs)
	return ru_options_shortcutdescription1(inputs)
});
export { options_shortcutdescription1 as "options_shortcutDescription" }