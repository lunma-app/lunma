/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Autoarchiveidleminutes3Inputs */

const en_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How long a temporary tab sits unused before it's archived (720 = 12h)`)
};

const es_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tiempo que una pestaña temporal permanece sin uso antes de archivarse (720 = 12h)`)
};

const pt_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quanto tempo um separador temporário fica inativo antes de ser arquivado (720 = 12h)`)
};

const fr_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Durée d'inactivité d'un onglet temporaire avant archivage (720 = 12h)`)
};

const de_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie lange ein temporärer Tab ungenutzt bleibt, bevor er archiviert wird (720 = 12 Std.)`)
};

const ja_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`一時タブがアーカイブされるまでの未使用時間（720 = 12時間）`)
};

const ko_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`임시 탭이 사용되지 않은 채 보관되기 전 대기 시간 (720 = 12시간)`)
};

const zh_cn2_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`临时标签页闲置多久后归档（720 = 12 小时）`)
};

const ru_options_desc_autoarchiveidleminutes3 = /** @type {(inputs: Options_Desc_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Как долго временная вкладка не используется до архивирования (720 = 12 ч)`)
};

/**
* | output |
* | --- |
* | "How long a temporary tab sits unused before it's archived (720 = 12h)" |
*
* @param {Options_Desc_Autoarchiveidleminutes3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_autoarchiveidleminutes3 = /** @type {((inputs?: Options_Desc_Autoarchiveidleminutes3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Autoarchiveidleminutes3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "es") return es_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "pt") return pt_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "fr") return fr_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "de") return de_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "ja") return ja_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "ko") return ko_options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_autoarchiveidleminutes3(inputs)
	return ru_options_desc_autoarchiveidleminutes3(inputs)
});
export { options_desc_autoarchiveidleminutes3 as "options_desc_autoArchiveIdleMinutes" }