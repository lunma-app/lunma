/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchiveedithelp3Inputs */

const en_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Override when this Space's idle tabs are archived.`)
};

const es_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Establece cuándo se archivan las pestañas inactivas de este espacio.`)
};

const pt_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Substituir quando os separadores inativos deste Espaço são arquivados.`)
};

const fr_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer la durée d'inactivité avant archivage pour cet espace.`)
};

const de_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Festlegen, wann inaktive Tabs dieses Raums archiviert werden.`)
};

const ja_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このスペースのアイドルタブがアーカイブされるタイミングを上書き。`)
};

const ko_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 스페이스의 유휴 탭 보관 시점을 재정의합니다.`)
};

const zh_cn2_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`覆盖此空间闲置标签页的归档时间`)
};

const ru_sidebar_autoarchiveedithelp3 = /** @type {(inputs: Sidebar_Autoarchiveedithelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Настройте, когда простаивающие вкладки этого пространства архивируются.`)
};

/**
* | output |
* | --- |
* | "Override when this Space's idle tabs are archived." |
*
* @param {Sidebar_Autoarchiveedithelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchiveedithelp3 = /** @type {((inputs?: Sidebar_Autoarchiveedithelp3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchiveedithelp3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "es") return es_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "pt") return pt_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "fr") return fr_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "de") return de_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "ja") return ja_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "ko") return ko_sidebar_autoarchiveedithelp3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchiveedithelp3(inputs)
	return ru_sidebar_autoarchiveedithelp3(inputs)
});
export { sidebar_autoarchiveedithelp3 as "sidebar_autoArchiveEditHelp" }