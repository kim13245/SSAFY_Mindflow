export const initialState = {
	user_message: '',
	isHovered: false,
	messages: [],
	multiModelResponses: null,
};

export const ACTIONS = {
	SET_MESSAGE: 'SET_MESSAGE',
	CLEAR_MESSAGE: 'CLEAR_MESSAGE',
	SET_HOVER: 'SET_HOVER',
	ADD_MESSAGE: 'ADD_MESSAGE',
	SET_MULTI_MODEL_RESPONSES: 'SET_MULTI_MODEL_RESPONSES',
};

export const chatReducer = (state, action) => {
	switch (action.type) {
		case ACTIONS.SET_MESSAGE:
			return { ...state, user_message: action.payload };
		case ACTIONS.CLEAR_MESSAGE:
			return { ...state, user_message: '' };
		case ACTIONS.SET_HOVER:
			return { ...state, isHovered: action.payload };
		case ACTIONS.ADD_MESSAGE:
			return {
				...state,
				messages: [...state.messages, action.payload]
			};
		case ACTIONS.SET_MULTI_MODEL_RESPONSES:
			return {
				...state,
				multiModelResponses: action.payload
			};
		default:
			return state;
	}
};