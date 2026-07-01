/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensnoconnections2Inputs */

const en_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No connections yet`)
};

const es_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay conexiones`)
};

const pt_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda sem ligações`)
};

const fr_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion`)
};

const de_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Verbindungen`)
};

const ja_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`接続がまだありません`)
};

const ko_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결된 서비스 없음`)
};

const zh_cn2_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`尚未连接`)
};

const ru_launcher_lensnoconnections2 = /** @type {(inputs: Launcher_Lensnoconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет подключений`)
};

/**
* | output |
* | --- |
* | "No connections yet" |
*
* @param {Launcher_Lensnoconnections2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensnoconnections2 = /** @type {((inputs?: Launcher_Lensnoconnections2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensnoconnections2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensnoconnections2(inputs)
	if (locale === "es") return es_launcher_lensnoconnections2(inputs)
	if (locale === "pt") return pt_launcher_lensnoconnections2(inputs)
	if (locale === "fr") return fr_launcher_lensnoconnections2(inputs)
	if (locale === "de") return de_launcher_lensnoconnections2(inputs)
	if (locale === "ja") return ja_launcher_lensnoconnections2(inputs)
	if (locale === "ko") return ko_launcher_lensnoconnections2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensnoconnections2(inputs)
	return ru_launcher_lensnoconnections2(inputs)
});
export { launcher_lensnoconnections2 as "launcher_lensNoConnections" }