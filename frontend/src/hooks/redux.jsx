import { createStore } from "redux";

export const VAR_SET_NAME = 'VAR_SET_NAME'
export const VAR_SET_REGISTER_ITEM = 'VAR_SET_REGISTER_ITEM'
export const VAR_SET_BREADCRUMBS = 'VAR_SET_BREADCRUMBS'
export const VAR_IS_PAGE_READONLY = 'VAR_IS_PAGE_READONLY'
export const VAR_SET_BREADCRUMBS_COUNTER = 'VAR_SET_BREADCRUMBS_COUNTER'
export const VAR_SET_TOTAL_EWS = 'VAR_SET_TOTAL_EWS'
export const VAR_IS_UPGRADE_FITUR = 'VAR_IS_UPGRADE_FITUR'
export const VAR_IS_PAGE_404 = 'VAR_IS_PAGE_404'
export const VAR_IS_PAGE_PREVIEW = 'VAR_IS_PAGE_PREVIEW'

const initialState = {
    name: '',
    register_item: {},
    breadcrumbs: [],
    breadcrumbsCounter: 0,
    is_page_readonly: false,
    total_ews: 0,
    is_upgrade_fitur: false,
    is_page_404: false,
    is_page_preview: false,
}

const reducer = (state = initialState, action) => {
    if (action.type === VAR_SET_NAME) {
        return {
            ...state,
            name: action.value,
        };
    }
    if (action.type === VAR_SET_REGISTER_ITEM) {
        return {
            ...state,
            register_item: action.value,
        };
    }
    if (action.type === VAR_SET_BREADCRUMBS) {
        return {
            ...state,
            breadcrumbs: action.value,
        };
    }
    if (action.type === VAR_SET_BREADCRUMBS_COUNTER) {
        return {
            ...state,
            breadcrumbsCounter: action.value,
        };
    }
    if (action.type === VAR_IS_PAGE_READONLY) {
        return {
            ...state,
            is_page_readonly: action.value,
        };
    }
    if (action.type === VAR_SET_TOTAL_EWS) {
        return {
            ...state,
            total_ews: action.value,
        };
    }
    if (action.type === VAR_IS_UPGRADE_FITUR) {
        return {
            ...state,
            is_upgrade_fitur: action.value,
        };
    }
    if (action.type === VAR_IS_PAGE_404) {
        return {
            ...state,
            is_page_404: action.value,
        };
    }
    if (action.type === VAR_IS_PAGE_PREVIEW) {
        return {
            ...state,
            is_page_preview: action.value,
        };
    }
    return state;
};

const store = createStore(reducer)

export default store