/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Recentlyarchiveddescription2Inputs */

const en_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tabs archived automatically land here — reopen one, or let it expire on the schedule above.`)
};

const es_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las pestañas archivadas automáticamente aparecen aquí — reabre una o déjala expirar según el plazo anterior.`)
};

const pt_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Os separadores arquivados automaticamente ficam aqui — reabra um ou deixe-o expirar conforme o prazo acima.`)
};

const fr_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les onglets archivés automatiquement arrivent ici — rouvrez-en un ou laissez-le expirer selon la planification ci-dessus.`)
};

const de_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatisch archivierte Tabs landen hier — erneut öffnen oder nach dem obigen Zeitplan ablaufen lassen.`)
};

const ja_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自動アーカイブされたタブがここに — 再度開くか、上のスケジュールで期限切れになります。`)
};

const ko_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자동으로 보관된 탭이 여기에 표시됩니다 — 다시 열거나 위의 일정에 따라 만료되도록 두세요.`)
};

const zh_cn2_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自动归档的标签页会在此显示 — 可重新打开，或按上方计划自动过期`)
};

const ru_options_recentlyarchiveddescription2 = /** @type {(inputs: Options_Recentlyarchiveddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Автоматически архивированные вкладки — откройте снова или дождитесь истечения срока.`)
};

/**
* | output |
* | --- |
* | "Tabs archived automatically land here — reopen one, or let it expire on the schedule above." |
*
* @param {Options_Recentlyarchiveddescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_recentlyarchiveddescription2 = /** @type {((inputs?: Options_Recentlyarchiveddescription2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Recentlyarchiveddescription2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_recentlyarchiveddescription2(inputs)
	if (locale === "es") return es_options_recentlyarchiveddescription2(inputs)
	if (locale === "pt") return pt_options_recentlyarchiveddescription2(inputs)
	if (locale === "fr") return fr_options_recentlyarchiveddescription2(inputs)
	if (locale === "de") return de_options_recentlyarchiveddescription2(inputs)
	if (locale === "ja") return ja_options_recentlyarchiveddescription2(inputs)
	if (locale === "ko") return ko_options_recentlyarchiveddescription2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_recentlyarchiveddescription2(inputs)
	return ru_options_recentlyarchiveddescription2(inputs)
});
export { options_recentlyarchiveddescription2 as "options_recentlyArchivedDescription" }