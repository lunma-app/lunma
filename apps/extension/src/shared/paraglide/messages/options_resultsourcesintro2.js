/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Resultsourcesintro2Inputs */

const en_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The launcher can also surface your browsing history and bookmarks. These are optional — enable each when you want it, and revoke access anytime from your browser's extension settings.`)
};

const es_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El lanzador también puede mostrar tu historial de navegación y marcadores. Son opcionales — activa cada uno cuando quieras y revoca el acceso desde los ajustes de extensiones de tu navegador.`)
};

const pt_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O launcher pode também mostrar o histórico de navegação e marcadores. São opcionais — ative cada um quando quiser e revogue o acesso em qualquer altura nas definições de extensões.`)
};

const fr_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lanceur peut aussi afficher votre historique et vos marque-pages. Optionnel — activez chaque source à la demande, et révoquez l'accès à tout moment depuis les paramètres des extensions.`)
};

const de_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Der Launcher kann auch deinen Browserverlauf und Lesezeichen anzeigen. Optional — jederzeit aktivierbar oder in den Erweiterungseinstellungen deaktivierbar.`)
};

const ja_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーで閲覧履歴とブックマークも表示できます。任意で有効化 — ブラウザの拡張機能設定からいつでも無効化可能。`)
};

const ko_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처는 브라우저 기록과 북마크도 표시할 수 있습니다. 선택 사항이며 원할 때 각각 활성화하고, 브라우저의 확장 프로그램 설정에서 언제든지 접근을 취소할 수 있습니다.`)
};

const zh_cn2_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启动器还可显示浏览历史和书签，均为可选项 — 按需启用，随时可在浏览器扩展设置中撤销授权`)
};

const ru_options_resultsourcesintro2 = /** @type {(inputs: Options_Resultsourcesintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Лаунчер может также показывать историю и закладки. Это опционально — включайте по желанию, доступ можно отозвать в настройках расширения браузера.`)
};

/**
* | output |
* | --- |
* | "The launcher can also surface your browsing history and bookmarks. These are optional — enable each when you want it, and revoke access anytime from your bro..." |
*
* @param {Options_Resultsourcesintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_resultsourcesintro2 = /** @type {((inputs?: Options_Resultsourcesintro2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Resultsourcesintro2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_resultsourcesintro2(inputs)
	if (locale === "es") return es_options_resultsourcesintro2(inputs)
	if (locale === "pt") return pt_options_resultsourcesintro2(inputs)
	if (locale === "fr") return fr_options_resultsourcesintro2(inputs)
	if (locale === "de") return de_options_resultsourcesintro2(inputs)
	if (locale === "ja") return ja_options_resultsourcesintro2(inputs)
	if (locale === "ko") return ko_options_resultsourcesintro2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_resultsourcesintro2(inputs)
	return ru_options_resultsourcesintro2(inputs)
});
export { options_resultsourcesintro2 as "options_resultSourcesIntro" }