/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensconnectservice2Inputs */

const en_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Connect a service`)
};

const es_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Conectar un servicio`)
};

const pt_pt2_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Ligar um serviço`)
};

const fr_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Connecter un service`)
};

const de_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Dienst verbinden`)
};

const ja_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ サービスを接続`)
};

const ko_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ 서비스 연결`)
};

const zh_cn2_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ 连接服务`)
};

const ru_sidebar_lensconnectservice2 = /** @type {(inputs: Sidebar_Lensconnectservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Подключить сервис`)
};

/**
* | output |
* | --- |
* | "+ Connect a service" |
*
* @param {Sidebar_Lensconnectservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensconnectservice2 = /** @type {((inputs?: Sidebar_Lensconnectservice2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensconnectservice2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensconnectservice2(inputs)
	if (locale === "es") return es_sidebar_lensconnectservice2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensconnectservice2(inputs)
	if (locale === "fr") return fr_sidebar_lensconnectservice2(inputs)
	if (locale === "de") return de_sidebar_lensconnectservice2(inputs)
	if (locale === "ja") return ja_sidebar_lensconnectservice2(inputs)
	if (locale === "ko") return ko_sidebar_lensconnectservice2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensconnectservice2(inputs)
	return ru_sidebar_lensconnectservice2(inputs)
});
export { sidebar_lensconnectservice2 as "sidebar_lensConnectService" }