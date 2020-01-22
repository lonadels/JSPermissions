import React, { Component } from 'react';

//import connect from '@vkontakte/vk-connect';
import '@vkontakte/vkui/dist/vkui.css';

import { ConfigProvider, Root, View, Panel, ScreenSpinner, Div, Group, List, Cell } from '@vkontakte/vkui';
import { PanelHeader, Button } from '@vkontakte/vkui';

import connect from '@vkontakte/vkui-connect-mock';
import { createStore } from 'redux';


const reducer = (state = { groups: {}, users: {} }, action) => {
	switch (action.type) {
		case "ADD_GROUP":
			let groupKeys = Object.keys(state.groups);
			return {
				...state,
				groups: {
					...state.groups,
					[2^groupKeys.length]: {
						name: action.name,
						permissions: []
					}
				}
			}
		case "ADD_PERMISSION":
			let group = state.groups[action.groupID];
			return {
				...state,
				groups: {
					...state.groups, [action.groupID]:
					{
						...group,
						permissions: [...group.permissions, action.permission]
					}
				}
			}
		case "ADD_USER":
			return { ...state, users: [...state.users, action.user] }
		default: return state;
	}
}

var store = createStore(reducer);

class User {
	constructor(name, privLevel) {
		this._name = name;
		this._privLevel = privLevel;
	}

	hasPermission(permission) {
		let permissions = [];

		for (let [group, bin] in Object.entries(store.getState().groups))
			if (bin & this.privLevel)
				permissions = [...permissions, ...store.getState().permissions[group]]

		return permissions.indexOf(permission) !== -1 && permissions.indexOf("-" + permission) === -1;
	}
}

export default class App extends Component {

	constructor() {
		super();

		this.state = {
			user: null,
			popout: <ScreenSpinner size='large' />,
			groups: []
		}

		this.fetchData();

		this.addUser = this.addUser.bind(this);
		this.addGroup = this.addGroup.bind(this);
		this.addPermission = this.addPermission.bind(this);

		store.subscribe(()=>{
			this.setState({groups: Object.values(store.getState().groups)})
		})
	}

	async fetchData() {
		const user = await connect.send('VKWebAppGetUserInfo');
		this.setState({ user, popout: null });
	}

	addUser() {
		//let user = new User("lonadels", );
		//user.
		//store.dispatch({type: "ADD_USER", user });
	}

	addGroup() {
		let name = "test";
		store.dispatch({ type: "ADD_GROUP", name });
	}

	addPermission() {
		//let user = new User("lonadels", );
		//user.
		//store.dispatch({type: "ADD_USER", user });
	}

	componentDidUpdate() {
		connect.subscribe(({ detail: { type, data } }) => {
			if (type === 'VKWebAppUpdateConfig') {
				const schemeAttribute = document.createAttribute('scheme');
				schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
				document.body.attributes.setNamedItem(schemeAttribute);
			}
		});
	}


	render() {
		
		return (
			<ConfigProvider>
				<Root>
					<View popout={this.state.popout}>
						<Panel>
							<PanelHeader>JSPermission</PanelHeader>
							<Group>
								<Div>
									<List>
										{ this.state.groups.map((group, i) => <Cell key={i}>{group.name}</Cell>) }
									</List>
									<Button onClick={this.addGroup}>Добавить группу</Button>
								</Div>
							</Group>

						</Panel>
					</View>
				</Root>
			</ConfigProvider>
		);
	}
}

