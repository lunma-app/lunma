/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Resultsourcesdescription2Inputs */

const en_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let the launcher also search your browser history and bookmarks. Each is granted in your browser, only when you turn it on.`)
};

const es_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que el lanzador busque también en tu historial y marcadores. Cada permiso se concede en tu navegador, solo cuando lo activas.`)
};

const pt_pt2_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permita que o launcher pesquise também o histórico e os marcadores. Cada opção é concedida no browser, apenas quando a ativar.`)
};

const fr_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laissez le lanceur chercher aussi dans votre historique et vos marque-pages. Chaque permission est accordée dans votre navigateur, uniquement quand vous l'activez.`)
};

const de_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verlauf und Lesezeichen im Launcher durchsuchen. Jede Quelle wird im Browser freigegeben — nur wenn aktiviert.`)
};

const ja_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーでブラウザ履歴とブックマークも検索できます。ブラウザで許可し、オンにしたときのみ有効になります。`)
};

const ko_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처가 브라우저 기록과 북마크도 검색하도록 합니다. 각 항목은 켤 때만 브라우저에서 권한이 부여됩니다.`)
};

const zh_cn2_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`让启动器也搜索浏览器历史记录和书签。各项需在浏览器中授权，仅在开启时生效`)
};

const ru_options_resultsourcesdescription2 = /** @type {(inputs: Options_Resultsourcesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Лаунчер также может искать в истории браузера и закладках. Доступ предоставляется в браузере при включении.`)
};

/**
* | output |
* | --- |
* | "Let the launcher also search your browser history and bookmarks. Each is granted in your browser, only when you turn it on." |
*
* @param {Options_Resultsourcesdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_resultsourcesdescription2 = /** @type {((inputs?: Options_Resultsourcesdescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Resultsourcesdescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_resultsourcesdescription2(inputs)
	if (locale === "es") return es_options_resultsourcesdescription2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_resultsourcesdescription2(inputs)
	if (locale === "fr") return fr_options_resultsourcesdescription2(inputs)
	if (locale === "de") return de_options_resultsourcesdescription2(inputs)
	if (locale === "ja") return ja_options_resultsourcesdescription2(inputs)
	if (locale === "ko") return ko_options_resultsourcesdescription2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_resultsourcesdescription2(inputs)
	return ru_options_resultsourcesdescription2(inputs)
});
export { options_resultsourcesdescription2 as "options_resultSourcesDescription" }