import React, { Component } from 'react';

import connect from '@vkontakte/vk-connect';
//import connect from '@vkontakte/vkui-connect-mock';

import '@vkontakte/vkui/dist/vkui.css';

import { ConfigProvider, Root, View, Panel, Div, Group, List, Cell, Input, Placeholder, PanelHeaderClose, Header, Footer, Switch, Alert, IS_PLATFORM_ANDROID, FormLayout, FormLayoutGroup, CellButton } from '@vkontakte/vkui';
import { PanelHeader, Button } from '@vkontakte/vkui';

import { createStore } from 'redux';

import Icon56UsersOutline from '@vkontakte/icons/dist/56/users_outline';
import Icon56LockOutline from '@vkontakte/icons/dist/56/lock_outline';

import Icon24Write from '@vkontakte/icons/dist/24/write';

import reducer from './Reducer';
import { declOfNum } from './Utils';

var store = createStore(reducer);

export default class App extends Component {

	constructor() {
		super();

		this.state = {
			activeView: "main",
			popout: null,

			valid: "default",
			permStatus: "default",

			groupName: "",
			groupNameEdit: "",
			groupPermission: "",

			groups: [],
			selectedGroups: [],
			permissions: [],

			editGroup: null
		}

		//this.fetchData();

		this.closePopout = this.closePopout.bind(this);

		this.addGroup = this.addGroup.bind(this);
		this.addPermission = this.addPermission.bind(this);

		this.editGroup = this.editGroup.bind(this);
		this.removeGroup = this.removeGroup.bind(this);

		this.onChange = this.onChange.bind(this);

		store.subscribe(() => {
			console.log(store.getState())
			this.setState({ groups: Object.values(store.getState().groups) })
		})

		connect.subscribe(({ detail: { type, data } }) => {
			if (type === 'VKWebAppUpdateConfig') {
				const schemeAttribute = document.createAttribute('scheme');
				schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
				document.body.attributes.setNamedItem(schemeAttribute);
			}
		});
	}

	async fetchData() {
		const user = await connect.send('VKWebAppGetUserInfo');
		this.setState({ user, popout: null });
	}

	addGroup() {
		let name = this.state.groupName;

		this.setState({ valid: name.length > 0 ? "default" : "error" });
		if (name.length < 1) return

		for (let [, group] of Object.entries(store.getState().groups))
			if (group.name === name)
				return this.setState({ valid: "error" });

		this.setState({ groupName: "" });
		store.dispatch({ type: "ADD_GROUP", name });
	}

	saveGroup(group) {
		let permissions = this.state.permissions;
		store.dispatch({ type: "SET_PERMISSIONS", groupID: group.id, permissions });

		if (this.state.groupNameEdit !== group.name)
			store.dispatch({ type: "SET_NAME", groupID: group.id, name: this.state.groupNameEdit });

		this.setState({ groupPermission: "", permissions: [] })
	}

	removeGroup(group) {
		this.setState({
			popout: <Alert
				actionsLayout={IS_PLATFORM_ANDROID ? "horizontal" : "vertical"}
				actions={[{
					title: 'Удалить',
					autoclose: true,
					style: 'destructive',
					// action: () => this.addActionLogItem('Пользователь больше не может модерировать контент.'),
				}, {
					title: 'Отмена',
					autoclose: true,
					style: 'cancel'
				}]}
				onClose={this.closePopout}
			>
				<h2>Подтвердите действие</h2>
				<p>Вы уверены, что хотите<br />удалить группу <b>{group.name}</b>?</p>
			</Alert>
		})
	}

	closePopout() {
		this.setState({ popout: null });
	}

	addPermission() {
		let permission = this.state.groupPermission;
		if (this.state.permissions.indexOf(permission) !== -1) return this.setState({ permStatus: "error" });
		if (permission.length < 1) return
		this.setState({ permissions: [...this.state.permissions, permission], groupPermission: "" })

	}

	getPermissions(group) {
		return group.permissions.join(", ") || "нет прав";
	}

	onChange(e) {
		const { name, value } = e.currentTarget;
		this.setState({ [name]: value, valid: "default", permStatus: "default" });
	}

	editGroup(group) {
		this.setState({ permissions: group.permissions, permStatus: "default", groupPermission: "" })

		const PermissionsList = (props) => <List>
			{this.state.permissions.length > 0 ? this.state.permissions.map((permission, i) => <Cell removable onRemove={(e, el) => {
				this.setState({
					permissions: [...this.state.permissions.slice(0, i), ...this.state.permissions.slice(i + 1)]
				})
			}} key={permission}>{permission}</Cell>) : <Placeholder icon={<Icon56LockOutline />}>В группе не установлены <br /> права</Placeholder>}
		</List>

		const GroupPermissionInput = () => <Input status={this.state.permStatus} value={this.state.groupPermission} onChange={this.onChange} name="groupPermission" type="text" placeholder="Право" />
		const GroupNameInput = () => <Input onChange={this.onChange} type="text" name="groupNameEdit" value={this.state.groupNameEdit} />

		this.setState({
			editGroup: <Panel id="editGroup_main">
				<PanelHeader
					left={<PanelHeaderClose onClick={() => this.setState({ activeView: 'main' })} />}
				>
					Редактирование группы
            </PanelHeader>
				<Group>
					<FormLayout>
						<FormLayoutGroup top="Имя группы">
							<GroupNameInput />
						</FormLayoutGroup>
					</FormLayout>
					<List>
						<CellButton onClick={() => this.removeGroup(group)} level="danger">Удалить группу</CellButton>
					</List>
				</Group>
				<Group title="Список прав">
					<Div style={{
						display: "flex"
					}}>
						<div style={{ flex: "0 1 100%" }} >
							<GroupPermissionInput />
						</div>
						<Button style={{ marginLeft: "10px" }} onClick={this.addPermission}>Добавить</Button>
					</Div>
					<PermissionsList />
				</Group>
				<Div>
					<Button size="xl" onClick={() => {
						this.saveGroup(group)
						this.setState({ activeView: 'main' })
					}}>Сохранить</Button>
				</Div>

			</Panel>, activeView: "editGroup", groupNameEdit: group.name
		})
	}

	render() {
		const groupsCount = this.state.groups.length;
		const permissions = [];

		const ActualPermissions = () => {

			if (this.state.selectedGroups.length > 0) {
				this.state.selectedGroups.map(id => {
					let group = store.getState().groups[id];

					group.permissions.map(permission => {
						if (permissions.indexOf(permission) === -1)
							permissions.push(permission);
						return true;
					}
					);

					return true;
				})
				return permissions.length > 0 ? "Активные права: " + permissions.join(", ") : "Нет активных прав"
			} else return "Нет выбранных групп"
		}

		return (
			<ConfigProvider>
				<Root popout={this.state.popout} activeView={this.state.activeView}>
					<View id="main" activePanel="main_main">
						<Panel id="main_main">
							<PanelHeader>JSPermission</PanelHeader>
							<Group>
								<Div>
									<ActualPermissions />
								</Div>
							</Group>
							<Group>
								<Div style={{
									display: "flex",
								}}>
									<div style={{ flex: "0 1 100%" }} >
										<Input status={this.state.valid} value={this.state.groupName} onChange={this.onChange} name="groupName" type="text" placeholder="Название группы" />
									</div>
									<Button style={{ marginLeft: "10px" }} onClick={this.addGroup}>Добавить</Button>
								</Div>
								<List>
									{groupsCount > 0 ? this.state.groups.map((group, i) => <Cell asideContent={<Switch onChange={(e) => {
										if (this.state.selectedGroups.indexOf(group.id) !== -1)
											this.setState({ selectedGroups: [...this.state.selectedGroups.slice(0, this.state.selectedGroups.indexOf(group.id)), ...this.state.selectedGroups.slice(this.state.selectedGroups.indexOf(group.id) + 1)] });
										else
											this.setState({ selectedGroups: [...this.state.selectedGroups, group.id] })
									}} checked={this.state.selectedGroups.indexOf(group.id) !== -1} />} before={<Icon24Write onClick={() => this.editGroup(group)} size={16} />} description={this.getPermissions(group)} key={i}>{group.name}</Cell>) : <Placeholder icon={<Icon56UsersOutline />}>Нет групп</Placeholder>}
								</List>

							</Group>
							{groupsCount > 0 && <Footer>{groupsCount} {declOfNum(groupsCount, [" группа", " группы", " групп"])}</Footer>}
						</Panel>
					</View>
					<View id="editGroup" activePanel="editGroup_main">
						{this.state.editGroup}
					</View>
				</Root>
			</ConfigProvider>
		);
	}
}

