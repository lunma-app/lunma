/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Cleararchivedconfirm2Inputs */

const en_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete all archived records? This cannot be undone.`)
};

const es_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar todos los registros archivados? Esta acción no se puede deshacer.`)
};

const pt_pt2_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar todos os registos arquivados? Esta ação não pode ser anulada.`)
};

const fr_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer tous les enregistrements archivés ? Cette action est irréversible.`)
};

const de_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle archivierten Einträge löschen? Dies kann nicht rückgängig gemacht werden.`)
};

const ja_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてのアーカイブを削除しますか？この操作は元に戻せません。`)
};

const ko_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관된 모든 기록을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)
};

const zh_cn2_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`删除所有归档记录？此操作不可撤销`)
};

const ru_options_cleararchivedconfirm2 = /** @type {(inputs: Options_Cleararchivedconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Удалить все архивные записи? Это невозможно отменить.`)
};

/**
* | output |
* | --- |
* | "Delete all archived records? This cannot be undone." |
*
* @param {Options_Cleararchivedconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_cleararchivedconfirm2 = /** @type {((inputs?: Options_Cleararchivedconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Cleararchivedconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_cleararchivedconfirm2(inputs)
	if (locale === "es") return es_options_cleararchivedconfirm2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_cleararchivedconfirm2(inputs)
	if (locale === "fr") return fr_options_cleararchivedconfirm2(inputs)
	if (locale === "de") return de_options_cleararchivedconfirm2(inputs)
	if (locale === "ja") return ja_options_cleararchivedconfirm2(inputs)
	if (locale === "ko") return ko_options_cleararchivedconfirm2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_cleararchivedconfirm2(inputs)
	return ru_options_cleararchivedconfirm2(inputs)
});
export { options_cleararchivedconfirm2 as "options_clearArchivedConfirm" }