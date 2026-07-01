/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenstokenerror2Inputs */

const en_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`That token didn't work — check it can read pull requests.`)
};

const es_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El token no funcionó — comprueba que pueda leer pull requests.`)
};

const pt_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O token não funcionou — verifique se tem permissão para ler pull requests.`)
};

const fr_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce token n'a pas fonctionné — vérifiez qu'il peut lire les pull requests.`)
};

const de_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dieser Token hat nicht funktioniert — prüfe, ob er Pull Requests lesen kann.`)
};

const ja_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`トークンが無効です — プルリクエストの読み取り権限を確認してください。`)
};

const ko_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`토큰이 작동하지 않습니다 — pull request 읽기 권한을 확인하세요.`)
};

const zh_cn2_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`令牌无效 — 请检查其是否有读取拉取请求的权限`)
};

const ru_sidebar_lenstokenerror2 = /** @type {(inputs: Sidebar_Lenstokenerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Токен не работает — убедитесь, что он может читать пул-реквесты.`)
};

/**
* | output |
* | --- |
* | "That token didn't work — check it can read pull requests." |
*
* @param {Sidebar_Lenstokenerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenstokenerror2 = /** @type {((inputs?: Sidebar_Lenstokenerror2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenstokenerror2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenstokenerror2(inputs)
	if (locale === "es") return es_sidebar_lenstokenerror2(inputs)
	if (locale === "pt") return pt_sidebar_lenstokenerror2(inputs)
	if (locale === "fr") return fr_sidebar_lenstokenerror2(inputs)
	if (locale === "de") return de_sidebar_lenstokenerror2(inputs)
	if (locale === "ja") return ja_sidebar_lenstokenerror2(inputs)
	if (locale === "ko") return ko_sidebar_lenstokenerror2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenstokenerror2(inputs)
	return ru_sidebar_lenstokenerror2(inputs)
});
export { sidebar_lenstokenerror2 as "sidebar_lensTokenError" }